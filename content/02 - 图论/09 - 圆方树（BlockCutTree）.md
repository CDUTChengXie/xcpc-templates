# 圆方树（BlockCutTree）

先 `BlockCutTree(n)`，每条无向边 `addEdge(u,v)` 一次，最后 `work()` 返回方点数与圆方森林边。

无向边只加入一次，自环不产生方点； 原点 0..n-1，方点 n..n+cnt-1；孤立点不产生方点，桥也产生一个方点。 加完边再 work；计算后改图须 init(n) 重建；森林边连接原点与其所属点双的方点。

O(n + m) 时间，O(n + m) 空间。

```cpp
struct BlockCutTree {
    int n;
    std::vector<std::vector<int>> adj;
    std::vector<int> dfn, low, stk;
    int cnt, cur;
    std::vector<std::pair<int, int>> edges; // work 后的无向森林边：一端是原点，另一端是所属方点，顺序不固定

    // 创建未初始化对象；使用前调用 init
    BlockCutTree() {}
    // 创建 n 个原点的空图
    BlockCutTree(int n) {
        init(n);
    }

    // 重置为 n 个原点的空图
    void init(int n) {
        this->n = n;
        adj.assign(n, {});
        dfn.assign(n, -1);
        low.resize(n);
        stk.clear();
        cnt = cur = 0;
        edges.clear();
    }

    // 加入一条无向边
    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // Tarjan DFS；仅供 work 调用
    void dfs(int x) {
        struct Frame {
            int vertex, parent;
            size_t next;
        };
        std::vector<Frame> frames{{x, -1, 0}};
        dfn[x] = low[x] = cur++;
        stk.push_back(x);
        while (!frames.empty()) {
            auto &frame = frames.back();
            int vertex = frame.vertex;
            if (frame.next < adj[vertex].size()) {
                int next = adj[vertex][frame.next++];
                if (dfn[next] == -1) {
                    dfn[next] = low[next] = cur++;
                    stk.push_back(next);
                    frames.push_back({next, vertex, 0});
                } else {
                    low[vertex] = std::min(low[vertex], dfn[next]);
                }
            } else {
                int parent = frame.parent;
                frames.pop_back();
                if (parent == -1)
                    continue;
                low[parent] = std::min(low[parent], low[vertex]);
                if (low[vertex] == dfn[parent]) {
                    int member;
                    do {
                        member = stk.back();
                        stk.pop_back();
                        edges.emplace_back(n + cnt, member);
                    } while (member != vertex);
                    edges.emplace_back(parent, n + cnt);
                    ++cnt;
                }
            }
        }
    }

    // 加完边后返回方点数和圆方森林边；原点 0..n-1，方点从 n 开始
    std::pair<int, std::vector<std::pair<int, int>>> work() {
        for (int i = 0; i < n; i++) {
            if (dfn[i] == -1) {
                stk.clear();
                dfs(i);
            }
        }
        return {cnt, edges};
    }
};
```
