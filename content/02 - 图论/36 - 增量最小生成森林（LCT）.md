# 增量最小生成森林（LCT）

无向图，n>=1；只支持加边；先给出最多加边次数，边权 w 与总权重用 i64。 外部点从0编号；重边、自环和负权可用；不连通时返回最小生成森林权重。

每次加边均摊 O(log(n+maxAdds))，空间 O(n+maxAdds)。

```cpp
namespace xcpc_incremental_mst {
    // 动态树维护路径最大权边
    struct LCT {
        // 动态树节点
        struct Node {
            int ch[2] = {0, 0};
            int fa = 0;
            bool rev = false;
            i64 val = 0;
            int res = 0; // 最大权边的节点编号；0 表示路径无边
        };

        int n, vertices;
        std::vector<Node> tr;

        // 创建未初始化对象；请改用带参构造设置点数
        LCT() {}
        // 创建 n 个总节点和 vertices 个原点的动态树
        LCT(int n_, int vertices_) : n(n_), vertices(vertices_), tr(n_ + 1) {}

        // 判断 x 是否为所在辅助树的根
        bool isRoot(int x) {
            int f = tr[x].fa;
            return f == 0 || (tr[f].ch[0] != x && tr[f].ch[1] != x);
        }

        // 用左右子树信息更新 x 路径上的最大权边
        void pull(int x) {
            tr[x].res = x > vertices ? x : 0;
            for (int child : tr[x].ch) {
                int y = tr[child].res;
                if (y && (!tr[x].res || tr[y].val > tr[tr[x].res].val))
                    tr[x].res = y;
            }
        }

        // 给 x 打上子树翻转标记
        void applyRev(int x) {
            std::swap(tr[x].ch[0], tr[x].ch[1]);
            tr[x].rev ^= 1;
        }

        // 下传 x 的翻转标记
        void push(int x) {
            if (tr[x].rev) {
                if (tr[x].ch[0]) {
                    applyRev(tr[x].ch[0]);
                }
                if (tr[x].ch[1]) {
                    applyRev(tr[x].ch[1]);
                }
                tr[x].rev = false;
            }
        }

        // 将 x 向上旋转一层
        void rotate(int x) {
            int y = tr[x].fa, z = tr[y].fa;
            int k = (tr[y].ch[1] == x);
            if (!isRoot(y)) {
                tr[z].ch[tr[z].ch[1] == y] = x;
            }
            tr[x].fa = z;
            tr[y].ch[k] = tr[x].ch[k ^ 1];
            if (tr[x].ch[k ^ 1]) {
                tr[tr[x].ch[k ^ 1]].fa = y;
            }
            tr[x].ch[k ^ 1] = y;
            tr[y].fa = x;
            pull(y);
            pull(x);
        }

        // 把 x 旋转到所在辅助树的根
        void splay(int x) {
            static std::vector<int> st;
            st.clear();
            int y = x;
            st.push_back(y);
            while (!isRoot(y)) {
                y = tr[y].fa;
                st.push_back(y);
            }
            while (!st.empty()) {
                push(st.back());
                st.pop_back();
            }
            while (!isRoot(x)) {
                int y = tr[x].fa, z = tr[y].fa;
                if (!isRoot(y)) {
                    if ((tr[y].ch[0] == x) ^ (tr[z].ch[0] == y)) {
                        rotate(x);
                    } else {
                        rotate(y);
                    }
                }
                rotate(x);
            }
        }

        // 打通根到 x 的偏好路径
        void access(int x) {
            for (int last = 0; x; last = x, x = tr[x].fa) {
                splay(x);
                tr[x].ch[1] = last;
                pull(x);
            }
        }

        // 把 x 置为所在树的根
        void makeRoot(int x) {
            access(x);
            splay(x);
            applyRev(x);
        }

        // 返回 x 所在树的根
        int findRoot(int x) {
            access(x);
            splay(x);
            while (tr[x].ch[0]) {
                push(x);
                x = tr[x].ch[0];
            }
            splay(x);
            return x;
        }

        // 抽出 u-v 路径，v 成为根
        void split(int u, int v) {
            makeRoot(u);
            access(v);
            splay(v);
        }

        // 连接 u、v，要求二者不在同一连通块
        void link(int u, int v) {
            makeRoot(u);
            if (findRoot(v) != u) {
                tr[u].fa = v;
            }
        }

        // 断开直接相连的 u、v
        void cut(int u, int v) {
            split(u, v);
            if (tr[v].ch[0] == u && tr[u].ch[1] == 0) {
                tr[v].ch[0] = 0;
                tr[u].fa = 0;
                pull(v);
            }
        }

        // 返回 v 所在路径最大权边的节点编号
        int maxEdge(int v) {
            return tr[v].res;
        }

        // 把节点 u 的权值改为 x
        void modify(int u, i64 x) {
            access(u);
            splay(u);
            tr[u].val = x;
            pull(u);
        }
    };
}
// 增量最小生成森林
class IncrementalMST {
    struct Edge {
        int u, v;
        i64 w;
    };
    int n, capacity, componentCount;
    __int128 sum = 0;
    xcpc_incremental_mst::LCT tree;
    std::vector<Edge> edges;
    std::vector<bool> chosen;

  public:
    // 创建 n 个点，预留最多 maxAdds 次加边；不支持删除
    IncrementalMST(int n, int maxAdds)
        : n(n), capacity(maxAdds), componentCount(n), tree(n + maxAdds, n) {
        if (n < 1 || maxAdds < 0)
            throw std::invalid_argument("invalid size");
    }
    // 加边后更新最小生成森林；这条新边入选返回 true
    bool addEdge(int u, int v, i64 w) {
        if (u < 0 || u >= n || v < 0 || v >= n)
            throw std::out_of_range("vertex");
        if (int(edges.size()) == capacity)
            throw std::length_error("maxAdds exceeded");
        int id = edges.size(), node = n + id + 1;
        edges.push_back({u, v, w});
        chosen.push_back(false);
        if (u == v)
            return false;
        tree.modify(node, w);
        ++u;
        ++v;
        if (tree.findRoot(u) != tree.findRoot(v)) {
            tree.link(u, node);
            tree.link(node, v);
            --componentCount;
            sum += w;
            return chosen[id] = true;
        }
        tree.split(u, v);
        int old = tree.maxEdge(v);
        assert(old > n);
        int oldId = old - n - 1;
        if (edges[oldId].w <= w)
            return false;
        auto e = edges[oldId];
        tree.cut(e.u + 1, old);
        tree.cut(e.v + 1, old);
        tree.link(u, node);
        tree.link(node, v);
        chosen[oldId] = false;
        sum += __int128(w) - e.w;
        return chosen[id] = true;
    }
    // 返回当前最小生成森林权重，超过i64范围时抛异常
    i64 weight() const {
        if (sum < std::numeric_limits<i64>::min() || sum > std::numeric_limits<i64>::max())
            throw std::overflow_error("weight exceeds i64");
        return i64(sum);
    }
    // 返回当前连通块数；1表示已有生成树
    int components() const {
        return componentCount;
    }
    // 返回输入编号 id 的边当前是否在最小生成森林内
    bool inTree(int id) const {
        if (id < 0 || id >= int(chosen.size()))
            throw std::out_of_range("edge");
        return chosen[id];
    }
};
```
