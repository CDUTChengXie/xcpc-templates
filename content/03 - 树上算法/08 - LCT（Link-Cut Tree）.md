# LCT（Link-Cut Tree）

先 `LCT(n)`，用 `modify(u,value)` 设置点权；`link` 加边、`cut` 删边，已连通的两点才能调用 `pathXor(u,v)`。

n>=1；点编号 1..n，0 为特殊占位值；link 前两点不连通，cut 前两点直接相连，路径查询前两点连通。 初始为孤立点，点权均为 0；修改、加删边后可直接查询；路径包含两个端点。

均摊 O(log n) 每次操作；空间 O(n)。

```cpp
// 支持动态加边、删边和路径异或查询的 Link-Cut Tree
struct LCT {
    // 辅助树节点
    struct Node {
        int ch[2] = {0, 0};
        int fa = 0;
        bool rev = false;
        int val = 0;
        int res = 0; // 路径信息（此版为 xor 和）
    };

    int n;
    std::vector<Node> tr;

    // 创建空对象；使用前用正整数构造
    LCT() {}
    // 创建编号 1..n_ 的 LCT，点权初始为 0
    LCT(int n_) : n(n_), tr(n_ + 1) {}

    // 判断 x 是否为辅助树的根
    bool isRoot(int x) {
        int f = tr[x].fa;
        return f == 0 || (tr[f].ch[0] != x && tr[f].ch[1] != x);
    }

    // 重新计算 x 的路径异或聚合
    void pull(int x) {
        tr[x].res = tr[tr[x].ch[0]].res ^ tr[tr[x].ch[1]].res ^ tr[x].val;
    }

    // 翻转 x 所代表的路径方向
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

    // 将 x 在其辅助树中上旋
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

    // 将 x 旋到辅助树根并下传路径标记
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

    // 将当前根到 x 的路径暴露为一条辅助树路径
    void access(int x) {
        for (int last = 0; x; last = x, x = tr[x].fa) {
            splay(x);
            tr[x].ch[1] = last;
            pull(x);
        }
    }

    // 将 x 设为所在树的表示根
    void makeRoot(int x) {
        access(x);
        splay(x);
        applyRev(x);
    }

    // 返回 x 所在树的表示根
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

    // 抽出 u-v 路径，使 v 成为辅助树根
    void split(int u, int v) {
        makeRoot(u);
        access(v);
        splay(v);
    }

    // 在 u、v 不连通时加入一条边
    void link(int u, int v) {
        makeRoot(u);
        if (findRoot(v) != u) {
            tr[u].fa = v;
        }
    }

    // 在 u、v 直接相连时删除该边
    void cut(int u, int v) {
        split(u, v);
        if (tr[v].ch[0] == u && tr[u].ch[1] == 0) {
            tr[v].ch[0] = 0;
            tr[u].fa = 0;
            pull(v);
        }
    }

    // 返回当前 v 上的路径异或聚合
    int getXor(int v) {
        return tr[v].res;
    }

    // 返回已连通 u-v 路径上全部点权的异或，含两个端点
    int pathXor(int u, int v) {
        split(u, v);
        return getXor(v);
    }

    // 将点 u 的权值改为 x
    void modify(int u, int x) {
        access(u);
        splay(u);
        tr[u].val = x;
        pull(u);
    }
};
```
