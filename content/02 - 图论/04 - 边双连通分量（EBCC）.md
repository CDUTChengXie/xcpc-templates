# 边双连通分量（EBCC）

节点 `0..n-1`。先 `EBCC(n)`，每条无向边 `addEdge(u,v)` 一次；加完后 `work()`，需要缩点森林时再 `compress()`。支持重边；改图前先 `init(n)` 重建。

O(n + m) 时间，O(n + m) 空间。

```cpp
// 割边与边双连通分量
struct EBCC {
    int n, edgeCount;
    std::vector<std::vector<std::pair<int, int>>> adj;
    std::vector<int> stk;
    std::vector<int> dfn, low, bel; // bel[u] 为 [0,cnt) 的边双编号；连接不同分量的原边为桥
    int cur, cnt; // cnt 为边双分量总数

    // 创建未初始化对象；使用前调用 init
    EBCC() {}
    // 创建 n 个点的空图
    EBCC(int n) {
        init(n);
    }

    // 重置为 n 个点的空图
    void init(int n) {
        this->n = n;
        adj.assign(n, {});
        dfn.assign(n, -1);
        low.resize(n);
        bel.assign(n, -1);
        stk.clear();
        cur = cnt = edgeCount = 0;
    }

    // 加入一条无向边
    void addEdge(int u, int v) {
        int id = edgeCount++;
        adj[u].push_back({v, id});
        adj[v].push_back({u, id});
    }

    // Tarjan DFS；仅供 work 调用
    void dfs(int x, int parentEdge) {
        struct Frame {
            int vertex, parent, edge;
            size_t next;
        };
        std::vector<Frame> frames{{x, -1, parentEdge, 0}};
        dfn[x] = low[x] = cur++;
        stk.push_back(x);
        while (!frames.empty()) {
            auto &frame = frames.back();
            int vertex = frame.vertex;
            if (frame.next < adj[vertex].size()) {
                auto [next, edge] = adj[vertex][frame.next++];
                if (edge == frame.edge)
                    continue;
                if (dfn[next] == -1) {
                    dfn[next] = low[next] = cur++;
                    stk.push_back(next);
                    frames.push_back({next, vertex, edge, 0});
                } else if (bel[next] == -1 && dfn[next] < dfn[vertex]) {
                    low[vertex] = std::min(low[vertex], dfn[next]);
                }
            } else {
                int parent = frame.parent;
                if (dfn[vertex] == low[vertex]) {
                    int member;
                    do {
                        member = stk.back();
                        stk.pop_back();
                        bel[member] = cnt;
                    } while (member != vertex);
                    ++cnt;
                }
                frames.pop_back();
                if (parent != -1)
                    low[parent] = std::min(low[parent], low[vertex]);
            }
        }
    }

    // 返回每个点的边双编号
    std::vector<int> work() {
        for (int i = 0; i < n; i++) {
            if (dfn[i] == -1) {
                dfs(i, -1);
            }
        }
        return bel;
    }

    // 边双缩点后的森林
    struct Graph {
        int n;
        std::vector<std::pair<int, int>> edges; // 每条原桥的两个分量号，不是原顶点号
        std::vector<int> siz;  // siz[c] 为分量 c 的原顶点数
        std::vector<int> cnte; // cnte[c] 为分量 c 的内部原边数
    };

    // work 后返回边双缩点森林；edges 为桥，siz/cnte 为分量点数/内部边数
    Graph compress() {
        Graph g;
        g.n = cnt;
        g.siz.resize(cnt);
        g.cnte.resize(cnt);
        for (int i = 0; i < n; i++) {
            g.siz[bel[i]]++;
            for (auto [j, id] : adj[i]) {
                if (bel[i] < bel[j]) {
                    g.edges.emplace_back(bel[i], bel[j]);
                } else if (bel[i] == bel[j]) {
                    g.cnte[bel[i]]++;
                }
            }
        }
        for (auto &count : g.cnte)
            count /= 2;
        return g;
    }
};
```
